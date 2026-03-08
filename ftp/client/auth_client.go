package client

import (
	"os"

	"github.com/404errorg6/FTP-server/config"
	"github.com/jlaffaye/ftp"
)

func AuthClient(user, pass, addr string) error {
	c, err := ftp.Dial(addr, ftp.DialWithTimeout(config.MaxTimeout), ftp.DialWithDebugOutput(os.Stdout))
	if err != nil {
		return err
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
