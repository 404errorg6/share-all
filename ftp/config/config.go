package config

import ftpserver "github.com/fclairamb/ftpserverlib"

type Client struct {
	Name    string
	Host    string
	Port    string
	Msg     string
	Context ftpserver.ClientContext
}
