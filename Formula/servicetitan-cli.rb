# frozen_string_literal: true

# Installs the ServiceTitan API command-line client.
class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.4.3.tgz"
  sha256 "605336fc6874db874cfe2b5afe25aba182ff59a58610c5f79582f855dd8b46eb"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.4.3", output
  end
end
