{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_22
    nodejs_22.pkgs.pnpm

    (pkgs.texlive.combine {
      inherit (pkgs.texlive) scheme-basic
        standalone dvisvgm pgfplots mathtools;
    })

    languagetool
  ];
}
