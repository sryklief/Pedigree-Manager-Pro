const axios = require('axios');
const crypto = require('crypto');
const { getDatabase } = require('./database');
const { machineIdSync } = require('node-machine-id');

class LicenseManager {
  constructor() {
    this.wooCommerceUrl = process.env.WOOCOMMERCE_URL || 'https://your-store.com';
    this.consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    this.consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
    this.deviceId = this.getDeviceId();
  }

  getDeviceId() {
    try {
      // Generate unique device ID based on machine characteristics
      const machineId = machineIdSync();
      return crypto.createHash('sha256').update(machineId).digest('hex');
    } catch (error) {
      console.error('Error generating device ID:', error);
      // Fallback to a combination of system info
      const os = require('os');
      const fallbackId = `${os.hostname()}-${os.platform()}-${os.arch()}`;
      return crypto.createHash('sha256').update(fallbackId).digest('hex');
    }
  }

  async validateLicense(licenseKey) {
    try {
      // First check if license is already activated on this device
      const existingActivation = await this.getLocalActivation(licenseKey);
      if (existingActivation && existingActivation.status === 'active') {
        return { success: true, message: 'License already activated on this device' };
      }

      // Validate with WooCommerce API
      const validationResult = await this.validateWithWooCommerce(licenseKey);
      
      if (!validationResult.success) {
        return validationResult;
      }

      // Check device limit
      const deviceCheckResult = await this.checkDeviceLimit(licenseKey);
      if (!deviceCheckResult.success) {
        return deviceCheckResult;
      }

      // Store activation locally
      await this.storeActivation(licenseKey, validationResult.expiresAt);
      
      return { 
        success: true, 
        message: 'License activated successfully',
        expiresAt: validationResult.expiresAt
      };

    } catch (error) {
      console.error('License validation error:', error);
      return { 
        success: false, 
        error: 'Failed to validate license. Please check your internet connection.' 
      };
    }
  }

  async validateWithWooCommerce(licenseKey) {
    try {
      const response = await axios.get(`${this.wooCommerceUrl}/wp-json/wc/v3/software-licenses/${licenseKey}`, {
        auth: {
          username: this.consumerKey,
          password: this.consumerSecret
        },
        timeout: 10000
      });

      const license = response.data;
      
      if (license.status !== 'active') {
        return { success: false, error: 'License is not active' };
      }

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return { success: false, error: 'License has expired' };
      }

      return { 
        success: true, 
        expiresAt: license.expires_at,
        maxDevices: license.activation_limit || 1
      };

    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { success: false, error: 'Invalid license key' };
      }
      throw error;
    }
  }

  async checkDeviceLimit(licenseKey) {
    try {
      // Get current activations from WooCommerce
      const response = await axios.get(`${this.wooCommerceUrl}/wp-json/wc/v3/software-licenses/${licenseKey}/activations`, {
        auth: {
          username: this.consumerKey,
          password: this.consumerSecret
        },
        timeout: 10000
      });

      const activations = response.data;
      const maxDevices = 1; // Default to 1, can be made configurable

      // Check if current device is already activated
      const currentDeviceActivation = activations.find(activation => 
        activation.device_id === this.deviceId
      );

      if (currentDeviceActivation) {
        return { success: true, message: 'Device already activated' };
      }

      // Check if we've reached the device limit
      const activeActivations = activations.filter(activation => 
        activation.status === 'active'
      );

      if (activeActivations.length >= maxDevices) {
        return { 
          success: false, 
          error: `License is already in use on ${maxDevices} device(s). Please deactivate on another device first.` 
        };
      }

      // Register this device
      await this.registerDevice(licenseKey);
      
      return { success: true };

    } catch (error) {
      console.error('Device limit check error:', error);
      // If we can't check online, allow activation but store locally
      return { success: true, message: 'Offline activation' };
    }
  }

  async registerDevice(licenseKey) {
    try {
      await axios.post(`${this.wooCommerceUrl}/wp-json/wc/v3/software-licenses/${licenseKey}/activations`, {
        device_id: this.deviceId,
        device_name: require('os').hostname(),
        activated_at: new Date().toISOString()
      }, {
        auth: {
          username: this.consumerKey,
          password: this.consumerSecret
        },
        timeout: 10000
      });
    } catch (error) {
      console.error('Device registration error:', error);
      // Continue with local activation even if online registration fails
    }
  }

  async storeActivation(licenseKey, expiresAt) {
    const db = getDatabase();
    
    try {
      // First, deactivate any existing activations
      const updateStmt = db.prepare('UPDATE license_activation SET status = "inactive"');
      updateStmt.run();

      // Insert new activation
      const insertStmt = db.prepare(
        `INSERT INTO license_activation (license_key, device_id, expires_at, status) 
         VALUES (?, ?, ?, 'active')`
      );
      insertStmt.run(licenseKey, this.deviceId, expiresAt);
    } catch (err) {
      throw err;
    }
  }

  async getLocalActivation(licenseKey) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(
        `SELECT * FROM license_activation 
         WHERE license_key = ? AND device_id = ? AND status = 'active'`
      );
      const row = stmt.get(licenseKey, this.deviceId);
      return row;
    } catch (err) {
      throw err;
    }
  }

  async isActivated() {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(
        `SELECT * FROM license_activation 
         WHERE device_id = ? AND status = 'active' 
         AND (expires_at IS NULL OR expires_at > datetime('now'))`
      );
      const row = stmt.get(this.deviceId);
      return !!row;
    } catch (err) {
      throw err;
    }
  }

  async getLicenseStatus() {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(
        `SELECT license_key, expires_at, activated_at FROM license_activation 
         WHERE device_id = ? AND status = 'active'`
      );
      const row = stmt.get(this.deviceId);
      
      if (row) {
        const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
        return {
          activated: !isExpired,
          licenseKey: row.license_key,
          expiresAt: row.expires_at,
          activatedAt: row.activated_at,
          expired: isExpired
        };
      } else {
        return { activated: false };
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = { LicenseManager };
