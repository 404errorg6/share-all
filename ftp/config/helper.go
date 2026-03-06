package config

import (
	"fmt"
	"net"
	"net/netip"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// TODO: Refactor this shit after kotlin integration
func getWifiOrCellularInterface() (net.Interface, error) {
	var nilIface net.Interface
	ifs, err := net.Interfaces()
	if err != nil {
		return nilIface, err
	}

	fmt.Printf("Up and Broadcast Interfaces:\n")

	for _, iface := range ifs {
		name := strings.ToLower(iface.Name)
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagBroadcast != 0 {
			fmt.Printf("	%v: %v\n", iface.Name, iface)
			isWifi := strings.Contains(name, "wi-fi") || strings.Contains(name, "wifi") || strings.HasPrefix(name, "wlan")

			if isWifi {
				return iface, nil
			}
		}
	}

	for _, iface := range ifs {
		name := strings.ToLower(iface.Name)
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagBroadcast != 0 {
			isCellular := strings.Contains(name, "cellular") || strings.HasPrefix(name, "ap") || strings.HasPrefix(name, "rmnet")

			if isCellular {
				return iface, nil
			}
		}
	}

	return nilIface, fmt.Errorf("Neither wifi nor mobile data enabled")
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
	fmt.Printf("Home: %v\n", home)

	if strings.Contains(home, "termux") { // support right path if in termux
		defAndroidStorage := "/storage/emulated/0"
		if _, err := os.Stat(defAndroidStorage); err == nil {
			home = defAndroidStorage
			fmt.Printf("Changed to: %v\n", home)
		} else {
			fmt.Printf("Home \"%v\" not accessible, returning \"%v\" instead\n", defAndroidStorage, home)
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
