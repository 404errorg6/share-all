package config

import (
	"os"
	"sync"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

type Access int

const (
	READ_ONLY Access = iota
	READ_WRITE
)

type Dir struct {
	Entries []FSObject
}

type FSObject struct {
	Name     string
	IsFolder bool
}

type MyServer struct {
	FTPHost                string
	FTPPort                string
	AnonymousAccessAllowed bool
	Root                   string
	Conn                   *ftpserver.FtpServer
	ConnectedClients       sync.Map
}

type Client struct {
	Name    string
	Host    string
	Port    string
	Msg     string
	Context ftpserver.ClientContext
}

var (
	DefFTPPort       = "2121"
	DefFTPHost       = "0.0.0.0"
	HTTPPort         = "8085"
	HTTPHost         = "127.0.0.1"
	LogsTestingCount = 0
	LogsCh           = make(chan string, 100) //Channel that sends logs
	HomeDir, _       = os.UserHomeDir()
	Server           MyServer
)
