# frozen_string_literal: true

# Installs the ServiceTitan API command-line client.
class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.4.2.tgz"
  sha256 "9ee1f0b7ff5a6176793ffb355ccb3bc5498ead7ae587d75519b8c37e3495380d"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.4.2", output
  end
end
