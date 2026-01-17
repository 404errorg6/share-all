package server

import (
	"fmt"
	ftpserver "github.com/fclairamb/ftpserverlib"
	"github.com/spf13/afero"
)

type AndroidClientDriver struct {
	afero.Fs
}

func (d *AndroidClientDriver) AuthUser(cc ftpserver.ClientContext, user, pass string) (ftpserver.ClientDriver, error) {
	remote := "unknown"
	if cc != nil {
		remote = cc.RemoteAddr().String()
	}
	fmt.Printf("AndroidClientDriver AuthUser called for user=%q from %v\n", user, remote)
	d.Fs = afero.NewOsFs()
	return d, nil
}

func (d *AndroidClientDriver) GetFs() afero.Fs {
	return d.Fs
}

