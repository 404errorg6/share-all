package config

import (
	"fmt"
	"sync"
	"time"

	ftpserver "github.com/fclairamb/ftpserverlib"
)

type FSObject struct {
	Name         string
	IsFolder     bool
	LastModified time.Time
	Size         int
}

type MyServer struct {
	FTPHost                string
	FTPPort                string
	RootDir                string
	AnonymousAccessAllowed bool
	WriteAllowed           bool
	IsRunning              bool
	Conn                   *ftpserver.FtpServer
	ConnectedClients       sync.Map
	BlackList              []string
	// TODO: Add users support
	//	Users            []Client
}

type Client struct {
	Name    string
	Host    string
	Port    string
	Msg     string
	Context ftpserver.ClientContext
}

var (
	DefFTPPort        = "2121"
	DefFTPHost        = "0.0.0.0"
	DefFTPWriteAccess = "false"
	DefAnonymous      = "true"
	HTTPPort          = "8085"
	HTTPHost          = "127.0.0.1"
	LogsTestingCount  = 0
	LogsCh            = make(chan string, 100) //Channel that sends logs
	DefRootDir        = getDefRootDir()
	Server            = MyServer{}
)

func (s *MyServer) BlockUser(host string) {
	s.ConnectedClients.Range(func(serverID, value any) bool {
		client, ok := value.(Client)
		if !ok {
			LogsCh <- fmt.Sprintf("Could not convert to client: %v", value)
			return false
		}

		if client.Host == host {
			Server.BlackList = append(Server.BlackList, host)
			client.Context.Close()
			return false
		}
		return true
	})
}

func (s *MyServer) UnblockUser(host string) []string {
	newBL := []string{}
	for _, s := range s.BlackList {
		if host == s {
			continue
		}
		newBL = append(newBL, s)
	}
	return newBL
}
