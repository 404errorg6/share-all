package server

import (
	"crypto/tls"
	"fmt"

	"github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

var (
	host = "127.0.0.1"
	port = "2121"
	addr = host + ":" + port
)

type AndroidMainDriver struct {
}

func (d *AndroidMainDriver) GetSettings() (*ftpserver.Settings, error) {
	settings := ftpserver.Settings{
		ListenAddr: ":" + port,
		PublicHost: host,
		PassiveTransferPortRange: ftpserver.PortRange{
			Start: 2122,
			End:   2130,
		},
	}
	return &settings, nil
}

func (d *AndroidMainDriver) ClientConnected(cc ftpserver.ClientContext) (string, error) {
	msg := fmt.Sprintf("%v successfully connected to FTP.", cc.RemoteAddr().String())
	return msg, nil
}

func (d *AndroidMainDriver) ClientDisconnected(cc ftpserver.ClientContext) {
	remoteAddr := cc.RemoteAddr()
	fmt.Printf("%v diconnected.\n", remoteAddr.String())
}

func (d *AndroidMainDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	cDriver := &AndroidClientDriver{}
	cDriver.Fs = afero.NewOsFs()
	afero.WriteFile(cDriver.Fs, "test.txt", []byte("Hello FTP"), 0644)
	return cDriver, nil
}

func (d *AndroidMainDriver) GetTLSConfig() (*tls.Config, error) {
	return nil, nil
}
