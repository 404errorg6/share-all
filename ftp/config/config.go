package config

import (
	"os"
	"sync"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

type Permission struct {
	CanRead   bool
	CanWrite  bool
	CanDelete bool
}

type FSObject struct {
	Name     string
	IsFolder bool
}

type MyServer struct {
	FTPHost                string
	FTPPort                string
	AnonymousAccessAllowed bool
	RootDir                string
	Conn                   *ftpserver.FtpServer
	ConnectedClients       sync.Map
	// TODO: Add users support
	//	Users            Client
}

//func (s *MyServer) AddUser() {}

type Client struct {
	Name    string
	Host    string
	Port    string
	Msg     string
	Root    string
	Access  Permission
	Context ftpserver.ClientContext
}

var (
	DefFTPPort       = "2121"
	DefFTPHost       = "0.0.0.0"
	DefAnonymous     = "true"
	HTTPPort         = "8085"
	HTTPHost         = "127.0.0.1"
	LogsTestingCount = 0
	LogsCh           = make(chan string, 100) //Channel that sends logs
	HomeDir, _       = os.UserHomeDir()
	Server           MyServer
)
