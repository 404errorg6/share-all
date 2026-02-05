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
	// We don't actually connect, so any IP works.
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1" // Fallback
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}
