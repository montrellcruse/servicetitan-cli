class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.3.4.tgz"
  sha256 "8d7daf142db0105b77940ff747f1ed77157f8d62d12b2c4e479158726889ba81"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.3.4", output
  end
end
