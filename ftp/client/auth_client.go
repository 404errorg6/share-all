package client

import (
	"os"
	"time"

	"github.com/jlaffaye/ftp"
)

func AuthClient(user, pass, addr string) error {
	c, err := ftp.Dial(addr, ftp.DialWithTimeout(5*time.Second), ftp.DialWithDebugOutput(os.Stdout))
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
