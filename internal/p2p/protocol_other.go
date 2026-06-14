//go:build !windows

package p2p

import "fmt"

func registerProtocol() error {
	return fmt.Errorf("custom protocol auto-registration is currently implemented for Windows only")
}
