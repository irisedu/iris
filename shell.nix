{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_22
    pnpm

    # patchouli
    (pkgs.texlive.combine {
      inherit (pkgs.texlive) scheme-basic
        standalone dvisvgm pgfplots mathtools;
    })
  ];
}
