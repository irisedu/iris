{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs_22
    pnpm

    # patchouli / latexer
    texliveFull
    poppler-utils
  ];
}
