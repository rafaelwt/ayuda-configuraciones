### Actualizar node en mac os
  > sudo npm cache clean -f (force) clear you npm cache
  > sudo npm install -g n install n (this might take a while)
  sudo n stable upgrade to the current stable version
 

### Si la version de node con nvm no se guarde al reiniciar la terminal
  > nano ~/.zshrc

Paste the following at the end of the file:
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

```
### Actulizar  zshrc
  > source ~/.zshrc

  > nvm use <version>
  ### Para que guadar la version y no se borre al cerar la terminal
  > nvm alias default <version>
