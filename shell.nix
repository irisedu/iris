{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_22
    nodejs_22.pkgs.pnpm
  ];
}
