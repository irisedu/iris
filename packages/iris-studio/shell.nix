{ pkgs ? import <nixpkgs> {} }:

# https://discourse.nixos.org/t/electron-7-development-environment/5002/3
# https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/electron/binary/generic.nix
(pkgs.buildFHSUserEnv {
  name = "electron-env";
  targetPkgs = pkgs: (with pkgs;
    [
      nodejs_22 pnpm

      systemd libdrm mesa libGL vulkan-loader stdenv.cc.cc alsa-lib at-spi2-atk
      cairo cups dbus expat gdk-pixbuf glib gtk3 nspr nss pango libxkbcommon
      libnotify
    ]
  ) ++ (with pkgs.xorg;
    [
      libXdamage libXext libXfixes libXrandr libX11 libXcomposite libxshmfence
      libxcb
    ]
  );
}).env
