package client

import (
	"fmt"
	"strings"
	"time"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func AuthClient(addr string, user, pass string) error {
	host, _, err := getHostPort(addr)
	if err != nil {
		return err
	}

	if alreadyConnected(host) {
		return fmt.Errorf("%v is already connected", host)
	}

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

func getHostPort(addr string) (string, string, error) {
	host, port, found := strings.Cut(addr, ":")
	if !found {
		config.LogsCh <- fmt.Sprintf("[FATAL]: %v doesn't contain \":\"", addr)
		return "", "", fmt.Errorf("\"%v\" doesn't contain \":\"", addr)
	}
	return host, port, nil
}

func alreadyConnected(host string) bool {
	var matchFound bool

	config.Server.ConnectedClients.Range(func(key, value any) bool {
		client, ok := value.(config.Client)
		if !ok {
			config.LogsCh <- fmt.Sprintf("[FATAL]: cannot convert to Client: %v", value)
			return false
		}

		if client.Host == host {
			matchFound = true
			return false
		}
		return true
	})

	if matchFound {
		return true
	}
	return false
}
