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
	cDriver := &AndroidClientDriver{}

	host, _, err := config.GetHostPort(cc.RemoteAddr().String())
	if err != nil {
		config.LogsCh <- err.Error()
	}

	if alreadyConnected(host) {
		return nil, fmt.Errorf("%v is already connected", host)
	}

	if config.Server.AnonymousAccessAllowed {
		if user == "anonymous" {
			config.Server.WriteAllowed = true
			cDriver.Fs = afero.NewBasePathFs(afero.NewOsFs(), config.Server.RootDir)
			isAuthorized = true
		}
	}

	if isAuthorized {
		addToConnectedClient(user, cc)
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
	rmFromConnectedClients(cc)
	config.LogsCh <- fmt.Sprintf("%v diconnected.", cc.RemoteAddr().String())
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
