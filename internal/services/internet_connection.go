package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/404errorg6/share-all/internal/oti"
	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p-core/peer"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
)

type Connection struct {
	ClientHost host.Host //Used for sending reqs to server
	ServerHost host.Host //Used for responding reqs from client
	ServerInfo *peer.AddrInfo
}

func (c *Connection) CloseServer() {
	c.ServerHost.Close()
}

func (c *Connection) CloseClient() {
	c.ClientHost.Close()
}

// TODO: Might exit before connection
func (c *Connection) CreateConnectKey() (string, error) { //Server creates the key and shares with client
	if c.ServerHost != nil {
		c.ServerHost.Close()
	}

	var err error
	c.ServerHost, err = libp2p.New(
		libp2p.ListenAddrStrings("/ip4/0.0.0.0/tcp/0"),
		libp2p.EnableRelay(),
		libp2p.ForceReachabilityPrivate(),
		libp2p.EnableHolePunching(),
	)

	if err != nil {
		return "", err
	}

	c.ServerHost.SetStreamHandler(oti.APP_LS_PROTOCOL, oti.HandlerLS)
	c.ServerHost.SetStreamHandler(oti.APP_FILE_TRANSFER_PROTOCOL, oti.HandlerFT)

	relayAddr, err := multiaddr.NewMultiaddr(config.RelayServerAddr)
	if err != nil {
		return "", err
	}

	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		return "", err
	}

	err = c.ServerHost.Connect(context.Background(), *relayInfo)
	if err != nil {
		return "", err
	}

	_, err = client.Reserve(context.Background(), c.ServerHost, *relayInfo)
	if err != nil {
		return "", err
	}

	ma := fmt.Sprintf("%s/p2p-circuit/p2p/%s", config.RelayServerAddr, c.ServerHost.ID().String())
	key := base64.StdEncoding.EncodeToString([]byte(ma))

	return key, nil
}

func (c *Connection) ConnectUsingKey(key string) error { //Client connects to server using the key
	if c.ClientHost != nil {
		c.ClientHost.Close()
	}

	var err error
	c.ClientHost, err = libp2p.New(
		libp2p.NoListenAddrs,
		libp2p.EnableRelay(),
		libp2p.ForceReachabilityPrivate(),
		libp2p.EnableHolePunching(),
	)

	if err != nil {
		return err
	}

	decoded, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return err
	}

	ma, err := multiaddr.NewMultiaddr(string(decoded))
	if err != nil {
		return err
	}

	c.ServerInfo, err = peer.AddrInfoFromP2pAddr(ma)
	if err != nil {
		return err
	}

	err = c.ClientHost.Connect(context.Background(), *c.ServerInfo)
	if err != nil {
		return err
	}

	return nil
}

func (c *Connection) RemoteLS(remotePath string) ([]config.FSObject, error) { //Performs LS on remote server
	var entries []config.FSObject

	stream, err := oti.GetLSStrem(c.ClientHost, c.ServerInfo.ID)
	if err != nil {
		return entries, err
	}
	defer stream.Close()

	_, err = stream.Write([]byte(remotePath))
	if err != nil {
		return entries, err
	}

	err = stream.CloseWrite()
	if err != nil {
		return entries, err
	}

	data, err := io.ReadAll(stream)
	if err != nil {
		return entries, err
	}

	err = json.Unmarshal(data, entries)
	if err != nil {
		return entries, err
	}

	return entries, nil
}

func (c *Connection) RemoteFT(localDirPath, remoteFilePath string) error {
	stream, err := oti.GetFTStream(c.ClientHost, c.ServerInfo.ID)
	if err != nil {
		return err
	}

	fullLocalPath := config.ResolveLocalPath(localDirPath)
	info, err := os.Lstat(fullLocalPath)
	if err != nil {
		return err
	}

	if !info.IsDir() {
		return fmt.Errorf("\"%v\" is not a directory", fullLocalPath)
	}

	fileName := filepath.Base(remoteFilePath)
	localFileName := filepath.Join(fullLocalPath, fileName)

	localFile, err := os.Create(localFileName)
	if err != nil {
		return err
	}
	defer localFile.Close()

	_, err = stream.Write([]byte(remoteFilePath))
	if err != nil {
		return err
	}
	defer stream.Close()

	err = stream.CloseWrite()
	if err != nil {
		return err
	}

	_, err = io.Copy(localFile, stream)
	if err != nil {
		return err
	}

	return nil
}
