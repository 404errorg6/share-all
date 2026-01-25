package config

import (
	"fmt"
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
