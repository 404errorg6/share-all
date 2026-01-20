package server

import (
	"crypto/tls"
	"fmt"

	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
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
	if user == "anonymous" {
		storeInfo(user, cc)
		cDriver := &AndroidClientDriver{}
		cDriver.Fs = afero.NewBasePathFs(afero.NewOsFs(), baseRoot) //Dir at baseRoot
		sendToLogsChPtr(fmt.Sprintf("%v authorization successful", cc.RemoteAddr().String()))
		return cDriver, nil
	}

	return nil, fmt.Errorf("Invalid credentials")
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()
	if alreadyConnected(remote) {
		return "", fmt.Errorf("%v is already connected", remote)
	}

	msg := fmt.Sprintf("%v connected", remote)
	sendToLogsChPtr(msg)
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	connectedClients.Delete(cc.ID())
	sendToLogsChPtr(fmt.Sprintf("%v diconnected.", cc.RemoteAddr().String()))
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
