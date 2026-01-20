package client

import (
	"fmt"
	"time"

	"github.com/jlaffaye/ftp"
)

var client *ftp.ServerConn

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

func GetClient() (*ftp.ServerConn, error) {
	if client == nil {
		return nil, fmt.Errorf("Authentication failed. Please login")
	}
	return client, nil
}
