### Install Go in Ubuntu

```bash
wget https://go.dev/dl/go1.22.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### Update Go

remove the old version and install the new one

```bash
sudo rm -rf /usr/local/go
```

and repeat the installation steps
