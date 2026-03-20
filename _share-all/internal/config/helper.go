package config

import (
	"fmt"
	"math/rand/v2"
	"net"
	"net/netip"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// TODO: Refactor this shit after kotlin integration

func getHostname() string {
	var defName string
	name, err := os.Hostname() //Try to get hostname

	if err != nil { //Fallback to DefFTPServerName+Random number
		randInt := rand.IntN(9999)

		randomizedName := fmt.Sprintf("%v[%v]", defName, randInt)
		return randomizedName
	}

	return name
}

func getWifiOrCellularInterface() (net.Interface, error) {
	var nilIface net.Interface
	ifs, err := net.Interfaces()
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "permission denied") {
			return nilIface, fmt.Errorf("Network permission not granted. Please grant network permissions to use the app.")
		}

		return nilIface, err
	}

	LogsCh <- "Available Interfaces:\n"

	for _, iface := range ifs {
		name := strings.ToLower(iface.Name)
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagBroadcast != 0 {
			LogsCh <- fmt.Sprintf("	%v: %v\n", iface.Name, iface)
			isWifi := strings.Contains(name, "wi-fi") || strings.Contains(name, "wifi") || strings.HasPrefix(name, "wlan")

			if isWifi {
				LogsCh <- fmt.Sprintf("Selected interface:\n	 %v: %v", iface.Name, iface)
				return iface, nil
			}
		}
	}

	for _, iface := range ifs {
		name := strings.ToLower(iface.Name)
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagBroadcast != 0 {
			isCellular := strings.Contains(name, "cellular") || strings.HasPrefix(name, "ap") || strings.HasPrefix(name, "rmnet")

			if isCellular {
				LogsCh <- fmt.Sprintf("Selected interface:\n	 %v: %v", iface.Name, iface)
				return iface, nil
			}
		}
	}

	return nilIface, fmt.Errorf("Neither wifi nor mobile data enabled. Please enable to run the app normally.")
}

// TODO: Duplicate
func getUsableIP(addrs []netip.Addr) (netip.Addr, error) {
	for _, addr := range addrs {
		if addr.Is4() && addr.IsPrivate() && !addr.IsLoopback() {
			firstOctet := addr.As4()[0]

			if !(firstOctet >= 192 && firstOctet <= 223) { //Ensure we're checking class C addresses
				LogsCh <- fmt.Sprintf("Skipped address %v: does not match required /24 subnet", addr.String())
				continue
			}

			return addr, nil
		}

	}

	return netip.Addr{}, fmt.Errorf("No usable ip found")
}

func GetInterfaceIpv4Addr(interfaceName string) (addr string, err error) {
	var (
		ief      *net.Interface
		addrs    []net.Addr
		ipv4Addr net.IP
	)
	if ief, err = net.InterfaceByName(interfaceName); err != nil { // get interface
		return
	}
	if addrs, err = ief.Addrs(); err != nil { // get addresses
		return
	}
	for _, addr := range addrs { // get ipv4 address
		if ipv4Addr = addr.(*net.IPNet).IP.To4(); ipv4Addr != nil {
			break
		}
	}
	if ipv4Addr == nil {
		return "", fmt.Errorf("%s", fmt.Sprintf("interface %s don't have an ipv4 address\n", interfaceName))
	}
	return ipv4Addr.String(), nil
}

func isAbsLocalPath(p string) bool {
	if filepath.IsAbs(p) {
		return true
	}
	// Manual check for Windows drive letters (e.g., C:/ or D:\)
	if len(p) >= 3 && p[1] == ':' && (p[2] == '/' || p[2] == '\\') {
		return true
	}
	return false
}

func isAbsRemotePath(p string) bool {
	if path.IsAbs(p) {
		return true
	}
	// Manual check for Windows drive letters (e.g., C:/ or D:\)
	if len(p) >= 3 && p[1] == ':' && (p[2] == '/' || p[2] == '\\') {
		return true
	}
	return false
}

func getDefRootDir() string {
	home, _ := os.UserHomeDir()
	LogsCh <- fmt.Sprintf("Home: %v\n", home)

	if strings.Contains(home, "termux") { // support right path if in termux
		defAndroidStorage := "/storage/emulated/0"
		if _, err := os.Stat(defAndroidStorage); err == nil {
			home = defAndroidStorage
			LogsCh <- fmt.Sprintf("Changed to: %v\n", home)
		} else {
			LogsCh <- fmt.Sprintf("Home \"%v\" not accessible, returning \"%v\" instead\n", defAndroidStorage, home)
		}
	}

	return home
}

func GetLocalIP() string { //TODO: Deprecated, waiitng for removal
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "127.0.0.1"
	}

	for _, address := range addrs {
		// check the address type and if it is not a loopback the display it
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				// Avoid link-local (169.254.x.x) if possible
				if !ipnet.IP.IsLinkLocalUnicast() {
					return ipnet.IP.String()
				}
			}
		}
	}

	// Double check if we can at least find any non-loopback IP
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return "127.0.0.1"
}

func getErrWindowTemplate(err error, errType string) string {
	if errType == "" {
		errType = "system"
	}

	errType = strings.ToTitle(errType)
	htmlTemplate := fmt.Sprintf(`
<!DOCTYPE html>
<html style="background: #0d1117; margin: 0; padding: 0; height: 100%%; overflow: hidden;">
<head>
    <style>
        body {
            color: #c9d1d9;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 24px;
            margin: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            box-sizing: border-box;
            overflow: hidden; /* Prevent body from scrolling */
        }
        .header {
            color: #58a6ff;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
        }
        .error-container {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
            flex-grow: 1;
            overflow-y: auto; /* Allow scrolling for long errors */
            scrollbar-width: none; /* Hides scrollbar in Firefox */
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .error-container::-webkit-scrollbar {
            display: none;
        }
        code {
            color: #f85149;
            font-family: 'Cascadia Code', 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="header">%s Error</div>
    <div class="error-container">
        <code>%s</code>
    </div>
</body>
</html>
`, errType, err.Error())

	return htmlTemplate
}
