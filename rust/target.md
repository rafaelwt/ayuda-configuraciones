
# For web assembly
cargo build --target wasm32-unknown-unknown --release
## Install target 
rustup target add wasm32-unknown-unknown
## List target
rustc --print target-list

## para lanzar a production 
wasm-pack build --release --target web
##  dev
wasm-pack build --target web

# For x86 32-bit

## Install target 
> rustup target add i686-pc-windows-msvc
## target for x86 is 32-bit
i686-pc-windows-msvc
## compile for x86 with 32-bit target
> cargo build --target i686-pc-windows-msvc