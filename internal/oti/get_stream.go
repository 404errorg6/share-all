package oti

import (
	"context"
	"fmt"

	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
)

func GetLSStrem(h host.Host, p peer.ID) (network.Stream, error) {
	var s network.Stream
	if h == nil {
		return s, fmt.Errorf("Connection error, try reconnecting...")
	}

	return h.NewStream(context.Background(), p, APP_LS_PROTOCOL)
}

func GetFTStream(h host.Host, p peer.ID) (network.Stream, error) {
	var s network.Stream
	if h == nil {
		return s, fmt.Errorf("Connection error, try reconnecting...")
	}

	return h.NewStream(context.Background(), p, APP_FILE_TRANSFER_PROTOCOL)
}
