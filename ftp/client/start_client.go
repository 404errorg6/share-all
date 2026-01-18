package client

import (
	"fmt"

	"github.com/jlaffaye/ftp"
)

var client *ftp.ServerConn

func AuthClient(addr string, user, pass string) error {
	c, err := ftp.Dial(addr)
	if err != nil {
		return nil
	}

	err = c.Login(user, pass)
	if err != nil {
		return nil
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
