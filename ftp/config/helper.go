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
		newHome := "/storage/emulated/0"
		_, err := os.Stat(newHome)
		if err != nil {
			fmt.Printf("Home \"%v\" not accessible, returning \"%v\" instead\n", newHome, home)
		}

		home = newHome
		fmt.Printf("Home: %v\n", home)
	}

	return home
}
