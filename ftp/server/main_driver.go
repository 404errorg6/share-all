package server

import (
	"crypto/tls"
	"fmt"
	"sync"

	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

var (
	logsChPtr        *chan string
	host             string
	port             string
	connectedClients sync.Map
	baseRoot         string
)

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr: host + ":" + port,
		PublicHost: host,
		PassiveTransferPortRange: ftpserver.PortRange{
			Start: 30000,
			End:   30050,
		},
	}
	return &settings, nil
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	remote := "unknown"
	if cc != nil {
		remote = cc.RemoteAddr().String()
	}

	if user == "anonymous" {
		storeInfo(user, cc)
		cDriver := &AndroidClientDriver{}
		cDriver.Fs = afero.NewBasePathFs(afero.NewOsFs(), baseRoot) //Dir at baseRoot
		sendToLogsChPtr(fmt.Sprintf("%v authorization successful", remote))
		return cDriver, nil
	}

	return nil, fmt.Errorf("Invalid credentials")
}

func storeInfo(user string, cc ftpserver.ClientContext) {
	info := fmt.Sprintf("%v: %v    %v", user, cc.RemoteAddr().String(), cc.RemoteAddr().Network())
	connectedClients.Store(cc.ID(), info)
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()
	msg := fmt.Sprintf("%v connected", remote)
	sendToLogsChPtr(msg)
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	remoteAddr := cc.RemoteAddr()
	connectedClients.Delete(cc.ID())
	sendToLogsChPtr(fmt.Sprintf("%v diconnected.", remoteAddr.String()))
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}

func sendToLogsChPtr(s string) {
	if logsChPtr != nil {
		select {
		case *logsChPtr <- s:
		default:
			fmt.Printf("[FAILURE] Channel full. Lost log: %v\n", s)
		}
	} else {
		fmt.Printf("[FAILURE] Use of nil logsChPtr. Lost log: %v\n", s)
	}
}
