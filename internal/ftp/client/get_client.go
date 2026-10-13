package client

import (
	"fmt"

	"github.com/jlaffaye/ftp"
)

var client *ftp.ServerConn

func GetClient() (*ftp.ServerConn, error) {
	if client == nil {
		return nil, fmt.Errorf("Authentication failed. Please login")
	}
	return client, nil
}
