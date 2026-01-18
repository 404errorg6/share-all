package server

import (
	"crypto/tls"
	"fmt"
	"sync"

	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

var (
	logsChPtr       *chan string
	host            = "127.0.0.1"
	port            = "2121"
	addr            = host + ":" + port
	connectedClient sync.Map
)

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr: addr,
		PublicHost: host,
		PassiveTransferPortRange: ftpserver.PortRange{
			Start: 2122,
			End:   2130,
		},
	}
	return &settings, nil
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()
	connectedClient.Store(cc.ID(), cc)
	msg := fmt.Sprintf("%v successfully connected to FTP.", remote)
	sendToLogsChPtr(fmt.Sprintf("%v connected", remote))
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	remoteAddr := cc.RemoteAddr()
	connectedClient.Delete(cc.ID())
	sendToLogsChPtr(fmt.Sprintf("%v diconnected.\n", remoteAddr.String()))
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	remote := "unknown"
	if cc != nil {
		remote = cc.RemoteAddr().String()
	}
	cDriver := &AndroidClientDriver{}
	cDriver.Fs = afero.NewOsFs()
	sendToLogsChPtr(fmt.Sprintf("Auth attempt from %v with user=%q\n", remote, user))
	return cDriver, nil
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
