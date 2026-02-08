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
	Name                   string
	User                   string
	Password               string
	Host                   string
	Port                   string
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

const (
	SERVICE = "_ftp._tcp"
	DOMAIN  = "local."
)

var (
	DefFTPPort             = "2121"
	DefFTPHost             = GetLocalIP()
	DefFTPWriteAccess      = "false"
	DefAnonymous           = "true"
	HTTPPort               = "8085"
	HTTPHost               = "127.0.0.1"
	LogsTestingCount       = 0
	LogsCh                 = make(chan string, 100) //Channel that sends logs
	DefLocalDir            = getDefRootDir()
	WifiOrDataInterface, _ = getWifiOrMobileInterface()
	FTPServer              = MyServer{}
)

func (s *MyServer) BlockUser(host string) {
	s.ConnectedClients.Range(func(serverID, value any) bool {
		client, ok := value.(Client)
		if !ok {
			LogsCh <- fmt.Sprintf("Could not convert to client: %v", value)
			return false
		}

		if client.Host == host {
			FTPServer.BlackList = append(FTPServer.BlackList, host)
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
