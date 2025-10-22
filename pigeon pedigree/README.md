# Pigeon Pedigree Manager

A professional desktop application for managing pigeon pedigrees, built with Electron and React.

## Features

- **License Management**: Secure license validation with WooCommerce integration
- **Local Data Storage**: SQLite database with offline functionality
- **4-Generation Pedigrees**: Complete family tree visualization
- **PDF Export**: Professional Hawkeye-style pedigree documents
- **Image Management**: Store body and eye photos for each bird
- **Common Ancestor Detection**: Automatic highlighting of inbreeding
- **Search & Filter**: Quick bird lookup and filtering
- **Parent Linking**: Autocomplete for parent selection
- **Duplicate Entry**: Quick pedigree duplication for related birds

## System Requirements

- Windows 10 or later
- macOS 10.14 or later
- 4GB RAM minimum
- 1GB free disk space

## Installation

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   WOOCOMMERCE_URL=https://your-store.com
   WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
   WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
   ```

4. Start development server:
   ```bash
   npm run electron-dev
   ```

### Production Build

#### Windows (.exe)
```bash
npm run dist-win
```

#### macOS (.dmg)
```bash
npm run dist-mac
```

## Usage

1. **First Launch**: Enter your license key when prompted
2. **Add Birds**: Use the "Add Bird" feature to create your database
3. **Link Parents**: Select existing birds as parents for automatic pedigree building
4. **Generate Pedigrees**: View 4-generation family trees
5. **Export PDFs**: Create professional pedigree documents

## License Activation

Each license key is valid for one device only. The application validates licenses online on first activation and stores the activation locally for offline use.

## Data Storage

- Database: SQLite in application data directory
- Images: Local images folder in application data directory
- Settings: Stored in database for persistence

## PDF Export Features

- Hawkeye-style professional layout
- Embedded images (body and eye photos)
- Loft branding and contact information
- Common ancestor highlighting
- Print-optimized formatting

## Support

For technical support or license issues, please contact support through your original purchase channel.

## Version History

### v1.0.0
- Initial release
- Complete pedigree management system
- PDF export functionality
- License validation system
