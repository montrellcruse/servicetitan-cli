# frozen_string_literal: true

# Installs the ServiceTitan API command-line client.
class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.4.4.tgz"
  sha256 "ecb5c4f2b3ded6f0e66fde60df1eb218560f0df99828f5be6c1d28185b80e48e"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.4.4", output
  end
end
