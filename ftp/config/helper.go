package config

import (
	"fmt"
	"net"
	"os"
	"strings"
)

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

func GetLocalIP() string {
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
