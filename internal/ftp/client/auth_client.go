package client

import (
	"changeme/internal/config"
	"os"

	"github.com/jlaffaye/ftp"
)

func AuthClient(user, pass, addr string) error {
	var c *ftp.ServerConn
	var err error

	if config.Dev {
		c, err = ftp.Dial(addr, ftp.DialWithTimeout(config.MaxTimeout), ftp.DialWithDebugOutput(os.Stdout))
		if err != nil {
			return err
		}
	} else {
		c, err = ftp.Dial(addr, ftp.DialWithTimeout(config.MaxTimeout))
		if err != nil {
			return err
		}
	}

	err = c.Login(user, pass)
	if err != nil {
		return err
	}

	client = c
	return nil
}

func DeAuthClient() {
	client = nil
}
