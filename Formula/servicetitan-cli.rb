class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.3.7.tgz"
  sha256 "f51432892325e94336eceec55729d7e01827a1634fbfbdcadc6ef0f528af8e52"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.3.7", output
  end
end
