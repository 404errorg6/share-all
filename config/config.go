package config

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/betamos/zeroconf"
	ftpserver "github.com/fclairamb/ftpserverlib"
)

type FSObject struct { //Struct used for sending to frontend to show entries
	Name         string
	IsFolder     bool
	LastModified time.Time
	Size         int
}

type MyServer struct { //FTP server's struct
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

type MiniWebServer struct { //WEb-share server's struct
	Host      string
	Port      string
	Conn      *http.Server //Initialized in handlers/http_handlers/start_web.go
	IsRunning bool
}

type Client struct { //Struct for client connected to FTP server
	Name    string
	Host    string
	Port    string
	Msg     string
	Context ftpserver.ClientContext
}

type ServerDiscoveryInfo struct { //Data sent in service discovery
	Name             string
	IP               string
	Port             string
	AnonymousAllowed bool
}

const (
	SERVICE       = "_ftp._tcp"
	DOMAIN        = "local."
	COMMONFTPNAME = "my ftp server" //Default name sent from frontend
)

var (
	AssetsServer http.Handler //will be initalized from root/init.go
	MiniServer   MiniWebServer
)

var (
	DefFTPServerName  = getHostname()
	DefFTPPort        = "2121"
	DefFTPHost, _     = GetInterfaceIpv4Addr(WifiOrDataInterface.Name)
	DefFTPWriteAccess = "false"
	DefAnonymous      = "true"
	DownloadLimit     = 1                //Won't change anything
	UploadLimit       = 1                //Won't change anything
	MaxTimeout        = time.Second * 10 //Max timeout while trying to connect to server

	LogsCh                 = make(chan string, 100) //Channel that sends logs to frontend
	DefLocalDir            = getDefRootDir()
	WifiOrDataInterface, _ = getWifiOrCellularInterface()
	FTPServer              = MyServer{}

	DiscoveryClient = zeroconf.New()
)

func init() {
	MiniServer.Host = DefFTPHost
	MiniServer.Port = "8080"
	MiniServer.Conn = &http.Server{
		Addr: MiniServer.Host + ":" + MiniServer.Port,
	}
}

func init() {
	iface, err := getWifiOrCellularInterface()
	if err != nil {
		LogsCh <- err.Error()
		panic(err)
	}

	_, err = GetInterfaceIpv4Addr(iface.Name)
	if err != nil {
		LogsCh <- err.Error()
		return
	}

}

func (s *MyServer) BlockUser(host string) {
	s.ConnectedClients.Range(func(serverID, value any) bool {
		continew := true
		brake := false

		client, ok := value.(Client)
		if !ok {
			LogsCh <- fmt.Sprintf("Could not convert to client: %v", value)
			return brake
		}

		if client.Host == host {
			FTPServer.BlackList = append(FTPServer.BlackList, host)
			client.Context.Close()
			return brake
		}

		return continew
	})
}

func (s *MyServer) UnblockUser(host string) {
	newBL := []string{}

	for _, s := range s.BlackList {
		if host == s {
			continue
		}
		newBL = append(newBL, s)
	}

	s.BlackList = newBL
}
