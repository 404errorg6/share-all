package server

import (
	"github.com/spf13/afero"
)

type AndroidClientDriver struct {
	afero.Fs
}

func (d *AndroidClientDriver) GetFs() afero.Fs {
	return d.Fs
}
