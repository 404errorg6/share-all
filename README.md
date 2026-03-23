<div align="center">
  <img src="https://github.com/404errorg6/FTP-server/blob/685b05e59a51d67953e95099178d4b0b30c8bf6e/appicon.png" alt="Share-All Icon" width="128" height="128">

  [![Go](https://img.shields.io/badge/Language-Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
  [![Wails](https://img.shields.io/badge/Framework-Wails_3-50C2F7?style=for-the-badge&logo=wails&logoColor=white)](https://v3.wails.io/)
  [![Web](https://img.shields.io/badge/Frontend-HTML5_/_CSS3_/_JS-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
  [![Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>


# Share-All

**Share anything with any device — with or without the app.**

The name Share-All represents the project’s core objective: to provide a universal bridge between devices. Whether using the dedicated application for high-speed transfers or a web browser for rapid, zero-install downloads, Share-All ensures that no file is left behind and no device is excluded from the local network.

---

## Application Screenshots

![browse-local](https://github.com/404errorg6/FTP-server/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/browse-local.png)
![my-server](https://github.com/404errorg6/share-all/blob/b08e0837af507d6483cd42eecd7b4ed888bd01bb/my-server.png)
![discovery](https://github.com/404errorg6/share-all/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/discover-servers.png)
![successful-connection](https://github.com/404errorg6/share-all/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/successful-connection.png)
![preview-image](https://github.com/404errorg6/share-all/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/preview-image.png)
![preview-text](https://github.com/404errorg6/share-all/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/preview-text.png)
![transfers](https://github.com/404errorg6/share-all/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/transfers.png)
![access-control](https://github.com/404errorg6/FTP-server/blob/73b6cdec4d0f613a1d7cc14e3dc60b84ade214b8/access-control.png)

---

## Core Features

### FTP Server (App-to-App)

Best for sharing with others who also have the Share-All app installed on their device.

- **Robust Performance**: Optimized for large directories and simultaneous multiple-file transfers.
- **System Security**: Full authentication support and IP-based access control.

### Web Browser Access (No App Required)

Use this to share with devices that do not have the app installed. Receivers can simply open the address shown in your panel using any modern web browser.

- **Zero Configuration**: No installation or setup required for the recipient.
- **Universal Compatibility**: Works across smartphones, tablets, smart TVs, and other PCs.

### Network Discovery and Security

Automatically identify other Share-All servers on the local Wi-Fi or LAN. Monitor active sessions in real-time and manage a blacklist of unauthorized IPs for enhanced network security.

### Platform Support

Share-All is currently tested and supported on **Windows** and **Linux**. While Wails 3 supports multiple platforms, macOS has not yet been tested.

---

## Installation and Setup

### Windows

1. Download the latest release binary.
2. Run the executable file.

### Linux

To allow global execution of the application from any directory, move the binary to your local bin path:

```bash
# After granting execution permissions
chmod +x share-all
sudo mv share-all /usr/local/bin/share-all
```

---

## For Developers

We welcome community contributions! Share-All is built using [Wails 3](https://v3.wails.io/), providing a modern bridge between Go backends and modern web frontends.

### Project Structure

- **Root Directory**: Contains the core server logic (FTP/Web) and the browser-based (pure web) interface.
- **_share-all Directory**: Contains the Wails 3 specific application logic and integration components.

### Development Roadmap

- [x] App-to-app share
- [x] No app share (Web Browser Access)
- [x] Discovery of local servers
- [x] Active session monitoring and device blocking
- [x] Client-side transfer details and history
- [x] Preview and download for common file types
- [ ] Drag & Drop support for file uploads
- [ ] Enhanced Transfer Controls (Cancel, Pause, Resume)
- [ ] Seeking support for retrying failed downloads instead of redownloading

### Build Instructions

To build from source, ensure you have the latest versions of Go and [Wails 3](https://v3alpha.wails.io/quick-start/installation/) installed on your machine.

```bash
git clone https://github.com/404errorg6/FTP-server.git
cd _share-all
wails3 build
```

---

*All connected devices must be on the same local network. No internet connection is required.*
