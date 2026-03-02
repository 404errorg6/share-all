package config

import (
	"fmt"
	"sync"
	"time"

	"github.com/betamos/zeroconf"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

type FSObject struct { //Struct used for ls apis(/api/ftp/server/ls and /api/ftp/client/ls)
	Name         string
	IsFolder     bool
	LastModified time.Time
	Size         int
}

type MyServer struct { //This server's struct
	Name                   string
	User                   string
	Password               string
	Host                   string
	Port                   string
	RootDir                string
	AnonymousAccessAllowed bool
	WriteAllowed           bool
	IsRunning              bool

	Conn             *ftpserver.FtpServer
	ConnectedClients sync.Map
	BlackList        []string
}

type Client struct { //Struct for clients connected to this server
	Name    string
	Host    string
	Port    string
	Msg     string
	Context ftpserver.ClientContext
}

type ServerInfo struct { //Data sent in service discovery
	Name             string
	IP               string
	Port             string
	AnonymousAllowed bool
}

const (
	SERVICE = "_ftp._tcp"
	DOMAIN  = "local."
)

var (
	DefFTPServerName  = "my ftp server"
	DefFTPPort        = "2121"
	DefFTPHost        = GetLocalIP()
	DefFTPWriteAccess = "false"
	DefAnonymous      = "true"
	DownloadLimit     = 3
	UploadLimit       = 3
	MaxTimeout        = time.Second * 10 //Max timeout while trying to connect to server

	HTTPPort               = "8085"
	HTTPHost               = "127.0.0.1"
	LogsTestingCount       = 0
	LogsCh                 = make(chan string, 100) //Channel that sends logs
	DefLocalDir            = getDefRootDir()
	WifiOrDataInterface, _ = getWifiOrCellularInterface()
	FTPServer              = MyServer{}

	DiscoveryClient = zeroconf.New()
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
