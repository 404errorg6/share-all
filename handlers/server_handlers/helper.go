package serverhandlers

import (
	"fmt"
	"math/rand/v2"
	"os"

	"github.com/404errorg6/FTP-server/config"
)

func getHostname() string {
	name, err := os.Hostname() //Try to get hostname

	if err != nil { //Fallback to DefFTPServerName+Random number
		randInt := rand.IntN(9999)

		randomizedName := fmt.Sprintf("%v[%v]", config.DefFTPServerName, randInt)
		return randomizedName
	}

	return name
}
