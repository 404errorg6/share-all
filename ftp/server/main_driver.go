package server

import (
	"crypto/tls"
	"fmt"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr: config.Server.FTPHost + ":" + config.Server.FTPPort,
		PublicHost: config.Server.FTPHost,
		PassiveTransferPortRange: ftpserver.PortRange{
			Start: 30000,
			End:   30050,
		},
	}
	return &settings, nil
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	var isAuthorized bool
	storeInfo(user, cc)
	cDriver := &AndroidClientDriver{}

	if config.Server.AnonymousAccessAllowed {
		if user == "anonymous" {
			cDriver.Permisson = config.READ_ONLY
			cDriver.Fs = afero.NewBasePathFs(afero.NewOsFs(), config.Server.Root)
			isAuthorized = true
		}
	}

	if user == "admin" && pass == "admin" {
		cDriver.Permisson = config.READ_WRITE
		cDriver.Fs = afero.NewBasePathFs(afero.NewOsFs(), config.Server.Root)
		isAuthorized = true
	}

	if isAuthorized {
		config.LogsCh <- fmt.Sprintf("%v authorization successful", cc.RemoteAddr().String())
		return cDriver, nil
	}

	return nil, fmt.Errorf("Invalid credentials")
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	remote := cc.RemoteAddr().String()

	msg := fmt.Sprintf("%v connected", remote)
	config.LogsCh <- msg
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	config.Server.ConnectedClients.Delete(cc.ID())
	config.LogsCh <- fmt.Sprintf("%v diconnected.", cc.RemoteAddr().String())
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
