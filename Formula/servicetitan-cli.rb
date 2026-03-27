class ServicetitanCli < Formula
  desc "First-party quality CLI for the ServiceTitan API"
  homepage "https://github.com/montrellcruse/servicetitan-cli"
  url "https://registry.npmjs.org/@rowvyn/servicetitan-cli/-/servicetitan-cli-0.1.0.tgz"
  sha256 "338648de1ad71f297245a5d854f724500685452cffc085662ef1915dd09d5636"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/st --version")
    assert_match "0.1.0", output
  end
end
