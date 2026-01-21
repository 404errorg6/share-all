package client

import (
	"time"

	"github.com/jlaffaye/ftp"
)

func AuthClient(addr string, user, pass string) error {
	c, err := ftp.Dial(addr, ftp.DialWithTimeout(5*time.Second))
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
