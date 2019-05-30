---
uuid: 8f045d80-8285-11e9-9a0d-dfce6aad8719
title: GitLab CI/CD 在 Node.js 项目中的实践
date: 2019-05-30 10:49:35
tags:
  - javascript
  - node.js
---

> 近期在按照业务划分项目时，我们组被分了好多的项目过来，大量的是基于 `Node.js` 的，也是我们组持续在使用的语言。  

## 现有流程中的一些问题

在维护多个项目的时候，会暴露出一些问题： 

1. 如何有效的使用 测试用例
2. 如何有效的使用 `ESLint`
3. 部署上线还能再快一些吗
   1. 使用了 `TypeScript` 以后带来的额外成本

<!-- more -->

### 测试用例

首先是测试用例，最初我们设计在了 `git hooks` 里边，在执行 `git commit` 之前会进行检查，在本地运行测试用例。  
这会带来一个时间上的问题，如果是日常开发，这么操作还是没什么问题的，但如果是线上 `bug` 修复，执行测试用例的时间依据项目大小可能会持续几分钟。  
而为了修复 `bug`，可能会采用 `commit` 的时候添加 `-n` 选项来跳过 `hooks` ，在修复 `bug` 时这么做无可厚非，但是即使大家在日常开发中都采用`commit -n` 的方式来跳过繁琐的测试过程，这个也是没有办法管控的，毕竟是在本地做的这个校验，是否遵循这个规则，全靠大家自觉。  

所以一段时间后发现，通过这种方式执行测试用例来规避一些风险的作用可能并不是很有效。  

### ESLint

然后就是 `ESLint`，我们团队基于[airbnb](https://github.com/airbnb/javascript)的 `ESLint` 规则自定义了一套更符合团队习惯的[规则](https://github.com/bluedapp/eslint-blued)，我们会在编辑器中引入插件用来帮助高亮一些错误，以及进行一些自动格式化的操作。  
同时我们也在 `git hooks` 中添加了对应的处理，也是在 `git commit` 的时候进行检查，如果不符合规范则不允许提交。  
不过这个与测试用例是相同的问题：  

1. 编辑器是否安装 `ESLint` 插件无从得知，即使安装插件、是否人肉忽略错误提示也无从得知。
2. `git hooks` 可以被绕过

### 部署上线的方式

之前团队的部署上线是使用[shipit](https://github.com/shipitjs/shipit)周边套件进行部署的。  
部署环境强依赖本地，因为需要在本地建立仓库的临时目录，并经过多次`ssh XXX "command"`的方式完成 部署 + 上线 的操作。  
`shipit`提供了一个有效的回滚方案，就是在部署后的路径添加多个历史部署版本的记录，回滚时将当前运行的项目目录指向之前的某个版本即可。_不过有一点儿坑的是，很难去选择我要回滚到那个节点，以及保存历史记录需要占用额外的磁盘空间_  
不过正因为如此，`shipit`在部署多台服务器时会遇到一些令人不太舒服的地方。  

如果是多台新增的服务器，那么可以通过在`shipit`配置文件中传入多个目标服务器地址来进行批量部署。  
但是假设某天需要上线一些小流量（比如四台机器中的一台），因为前边提到的`shipit`回滚策略，这会导致单台机器与其他三台机器的历史版本时间戳不一致（因为这几台机器不是同一时间上线的）  
_提到了这个时间戳就另外提一嘴，这个时间戳的生成是基于执行上线操作的那台机器的本地时间，之前有遇到过同事在本地测试代码，将时间调整为了几天前的时间，后时间没有改回正确的时间时进行了一次部署操作，代码出现问题后却发现回滚失败了，原因是该同事部署的版本时间戳太小，`shipit` 找不到之前的版本（`shipit` 可以设置保留历史版本的数量，当时最早的一次时间戳也是大于本次出问题的时间戳的）_  

也就是说，哪怕有一次进行过小流量上线，那么以后就用不了批量上线的功能了 _（没有去仔细研究`shipit`官方文档，不知道会不会有类似`--force`之类的忽略历史版本的操作）_  

基于上述的情况，我们的部署上线耗时变为了： （__机器数量__）X（__基于本地网速的仓库克隆、多次 ssh 操作的耗时总和__）。  _P.S. 为了保证仓库的有效性，每次执行 `shipit` 部署，它都会删除之前的副本，重新克隆_  

尤其是服务端项目，有时紧急的 `bug` 修复可能是在非工作时间，这意味着可能当时你所处的网络环境并不是很稳定。  
我曾经晚上接到过同事的微信，让我帮他上线项目，他家的 `Wi-Fi` 是某博士的，下载项目依赖的时候出了些问题。  
还有过使用移动设备开热点的方式进行上线操作，有一次非前后分离的项目上线后，直接就收到了联通的短信：「您本月流量已超出XXX」（当时还在用合约套餐，一月就800M流量）。

#### TypeScript

在去年下半年开始，我们团队就一直在推动 `TypeScript` 的应用，因为在大型项目中，拥有明确类型的 `TypeScript` 显然维护性会更高一些。  
但是大家都知道的， `TypeScript` 最终需要编译转换为 `JavaScript`（也有 `tsc` 那种的不生成 `JS` 文件，直接运行，不过这个更多的是在本地开发时使用，线上代码的运行我们还是希望变量越少越好）。  

所以之前的上线流程还需要额外的增加一步，编译 `TS`。  
而且因为`shipit`是在本地克隆的仓库并完成部署的，所以这就意味着我们必须要把生成后的 `JS` 文件也放入到仓库中，最直观的，从仓库的概览上看着就很丑（50% `TS`、50% `JS`），同时这进一步增加了上线的成本。  

> 总结来说，现有的部署上线流程过于依赖本地环境，因为每个人的环境不同，这相当于给部署流程增加了很多不可控因素。  

## 如何解决这些问题

上边我们所遇到的一些问题，其实可以分为两块：

1. 有效的约束代码质量
2. 快速的部署上线

所以我们就开始寻找解决方案，因为我们的源码是使用自建的 `GitLab` 仓库来进行管理的，首先就找到了 [GitLab CI/CD](https://docs.gitlab.com/ee/ci/README.html)。  
在研究了一番文档以后发现，它能够很好的解决我们现在遇到的这些问题。  

要使用 `GitLab CI/CD` 是非常简单的，只需要额外的使用一台服务器安装 `gitlab-runner`，并将要使用 `CI/CD` 的项目注册到该服务上就可以了。  
`GitLab` 官方文档中有非常详细的安装注册流程：

[install | runner](https://docs.gitlab.com/runner/install/)
[register | runner](https://docs.gitlab.com/runner/register/)
[group register | repo](https://docs.gitlab.com/ee/ci/runners/#registering-a-group-runner) 注册 `Group` 项目时的一些操作

> 上边的注册选择的是注册 group ，也就是整个 GitLab 某个分组下所有的项目。  
> 主要目的是因为我们这边项目数量太多，单个注册太过繁琐（还要登录到 runner 服务器去执行命令才能够注册）  

### 安装时需要注意的地方

> 官网的流程已经很详细了，不过还是有一些地方可以做一些小提示，避免踩坑  

```bash
sudo gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
```

这是 `Linux` 版本的安装命令，安装需要 `root` （管理员） 权限，后边跟的两个参数：  
- `--user` 是 `CI/CD` 执行 job （后续所有的流程都是基于 job 的）时所使用的用户名
- `--working-directory` 是 `CI/CD` 执行时的根目录路径 __个人的踩坑经验是将目录设置为一个空间大的磁盘上，因为 `CI/CD` 会生成大量的文件，尤其是如果使用 `CI/CD` 进行编译 TS 文件并且将其生成后的 JS 文件缓存；这样的操作会导致 `innode` 不足产生一些问题__  

> `--user` 的意思就是 `CI/CD` 执行使用该用户进行执行，所以如果要编写脚本之类的，建议在该用户登录的状态下编写，避免出现无权限执行 `sudo su gitlab-runner`  

### 注册时需要注意的地方

在按照官网的流程执行时，我们的 `tag` 是留空的，暂时没有找到什么用途。。  
以及 `executor` 这个比较重要了，因为我们是从手动部署上线还是往这边靠拢的，所以稳妥的方式是一步步来，也就是说我们选择的是 `shell` ，最常规的一种执行方式，对项目的影响也是比较小的（官网示例给的是 `docker` ）

### .gitlab-ci.yml 配置文件

上边的环境已经全部装好了，接下来就是需要让 `CI/CD` 真正的跑起来
`runner` 以哪种方式运行，就靠这个配置文件来描述了，按照约定需要将文件放置到 `repo` 仓库的根路径下。  
当该文件存在于仓库中，执行 `git push` 命令后就会自动按照配置文件中所描述的动作进行执行了。  

- [quick start](https://docs.gitlab.com/ee/ci/quick_start/)
- [configuration](https://docs.gitlab.com/ee/ci/yaml/)

> 上边的两个链接里边信息非常完整，包含各种可以配置的选项。  

一般来讲，配置文件的结构是这样的：

```yaml
stages:
  - stage1
  - stage2
  - stage3

job 1:
  stage: stage1
  script: echo job1

job 2:
  stage: stage2
  script: echo job2

job 3:
  stage: stage2
  script:
    - echo job3-1
    - echo job3-2

job 4:
  stage: stage3
  script: echo job4
```

`stages` 用来声明有效的可被执行的 `stage`，按照声明的顺序执行。  
下边的那些 `job XXX` 名字不重要，这个名字是在 `GitLab CI/CD Pipeline` 界面上展示时使用的，重要的是那个 `stage` 属性，他用来指定当前的这一块 `job` 隶属于哪个 `stage`。  
`script` 则是具体执行的脚本内容，如果要执行多行命令，就像`job 3`那种写法就好了。  

如果我们将上述的 `stage`、`job` 之类的换成我们项目中的一些操作`install_dependencies`、`test`、`eslint`之类的，然后将`script`字段中的值换成类似`npx eslint`之类的，当你把这个文件推送到远端服务器后，你的项目就已经开始自动运行这些脚本了。  
并且可以在`Pipelines`界面看到每一步执行的状态。  

> _P.S. 默认情况下，上一个 `stage` 没有执行完时不会执行下一个 `stage` 的，不过也可以通过额外的配置来修改：_  
> [allow failure](https://docs.gitlab.com/ee/ci/yaml/#allow_failure)  
> [when](https://docs.gitlab.com/ee/ci/yaml/#when)

#### 设置仅在特定的情况下触发 CI/CD

上边的配置文件存在一个问题，因为在配置文件中并没有指定哪些分支的提交会触发 `CI/CD` 流程，所以默认的所有分支上的提交都会触发，这必然不是我们想要的结果。  
`CI/CD` 的执行会占用系统的资源，如果因为一些开发分支的执行影响到了主干分支的执行，这是一件得不偿失的事情。  

所以我们需要限定哪些分支才会触发这些流程，也就是要用到了配置中的 [only](https://docs.gitlab.com/ee/ci/yaml/#onlyexcept-advanced) 属性。  

使用`only`可以用来设置哪些情况才会触发 `CI/CD`，一般我们这边常用的就是用来指定分支，这个是要写在具体的 `job` 上的，也就是大致是这样的操作：  

> [具体的配置文档](https://docs.gitlab.com/ee/ci/yaml/#onlyexcept-basic)

```yaml
job 1:
  stage: stage1
  script: echo job1
  only:
    - master
    - dev
```

单个的配置是可以这样写的，不过如果 `job` 的数量变多，这么写就意味着我们需要在配置文件中大量的重复这几行代码，也不是一个很好看的事情。  
所以这里可能会用到一个`yaml`的语法：

> 这是一步可选的操作，只是想在配置文件中减少一些重复代码的出现  

```yaml
.access_branch_template: &access_branch
  only:
    - master
    - dev

job 1:
  <<: *access_branch
  stage: stage1
  script: echo job1

job 2:
  <<: *access_branch
  stage: stage2
  script: echo job2
```

_一个类似模版继承的操作，官方文档中也没有提到，这个只是一个减少冗余代码的方式，可有可无。_  

### 缓存必要的文件

因为默认情况下，`CI/CD`在执行每一步（`job`）时都会清理一下当前的工作目录，保证工作目录是干净的、不包含一些之前任务留下的数据、文件。  
不过这在我们的 `Node.js` 项目中就会带来一个问题。  
因为我们的 `ESLint`、单元测试 都是基于 `node_modules` 下边的各种依赖来执行的。  
而目前的情况就相当于我们每一步都需要执行`npm install`，这显然是一个不必要的浪费。  

所以就提到了另一个配置文件中的选项：[cache](https://docs.gitlab.com/ee/ci/yaml/#cache)  

用来指定某些文件、文件夹是需要被缓存的，而不能清除：

```yaml
cache:
  key: ${CI_BUILD_REF_NAME}
  paths:
    - node_modules/
```

大致是这样的一个操作，`CI_BUILD_REF_NAME`是一个 `CI/CD` 提供的环境变量，该变量的内容为执行 `CI/CD` 时所使用的分支名，通过这种方式让两个分支之间的缓存互不影响。  

### 部署项目

如果基于上边的一些配置，我们将 单元测试、`ESLint` 对应的脚本放进去，他就已经能够完成我们想要的结果了，如果某一步执行出错，那么任务就会停在那里不会继续向后执行。  
不过目前来看，后边已经没有多余的任务供我们执行了，所以是时候将 部署 这一步操作接过来了。  

部署的话，我们目前选择的是通过 `rsync` 来进行同步多台服务器上的数据，一个比较简单高效的部署方式。  

> P.S. 部署需要额外的做一件事情，就是建立从`gitlab runner`所在机器`gitlab-runner`用户到目标部署服务器对应用户下的机器信任关系。  
> 有 N 多种方法可以实现，最简单的就是在`runner`机器上执行 `ssh-copy-id` 将公钥写入到目标机器。  
> 或者可以像我一样，提前将 `runner` 机器的公钥拿出来，需要与机器建立信任关系时就将这个字符串写入到目标机器的配置文件中。  
> 类似这样的操作：`ssh 10.0.0.1 "echo \"XXX\" >> ~/.ssh/authorized_keys"`

大致的配置如下：

```yaml
variables:
  DEPLOY_TO: /home/XXX/repo # 要部署的目标服务器项目路径
deploy:
  stage: deploy
  script:
    - rsync -e "ssh -o StrictHostKeyChecking=no" -arc --exclude-from="./exclude.list" --delete . 10.0.0.1:$DEPLOY_TO
    - ssh 10.0.0.1 "cd $DEPLOY_TO; npm i --only=production"
    - ssh 10.0.0.1 "pm2 start $DEPLOY_TO/pm2/$CI_ENVIRONMENT_NAME.json;"
```

> 同时用到的还有`variables`，用来提出一些变量，在下边使用。  

`ssh 10.0.0.1 "pm2 start $DEPLOY_TO/pm2/$CI_ENVIRONMENT_NAME.json;"`，这行脚本的用途就是重启服务了，我们使用`pm2`来管理进程，默认的约定项目路径下的`pm2`文件夹存放着个个环境启动时所需的参数。  

_当然了，目前我们在用的没有这么简单，下边会统一提到_  

__并且在部署的这一步，我们会有一些额外的处理__  

这是比较重要的一点，因为我们可能会更想要对上线的时机有主动权，所以 `deploy` 的任务并不是自动执行的，我们会将其修改为手动操作还会触发，这用到了另一个配置参数：

```yaml
deploy:
  stage: deploy
  script: XXX
  when: manual  # 设置该任务只能通过手动触发的方式运行
```

_当然了，如果不需要，这个移除就好了，比如说我们在测试环境就没有配置这个选项，仅在线上环境使用了这样的操作_  

### 更方便的管理 CI/CD 流程

如果按照上述的配置文件进行编写，实际上已经有了一个可用的、包含完整流程的 `CI/CD` 操作了。  

不过它的维护性并不是很高，尤其是如果 `CI/CD` 被应用在多个项目中，想做出某项改动则意味着所有的项目都需要重新修改配置文件并上传到仓库中才能生效。  

所以我们选择了一个更灵活的方式，最终我们的 `CI/CD` 配置文件是大致这样子的（省略了部分不相干的配置）：

```yaml
variables:
  SCRIPTS_STORAGE: /home/gitlab-runner/runner-scripts
  DEPLOY_TO: /home/XXX/repo # 要部署的目标服务器项目路径

stages:
  - install
  - test
  - build
  - deploy_development
  - deploy_production

install_dependencies:
  stage: install
  script: bash $SCRIPTS_STORAGE/install.sh

unit_test:
  stage: test
  script: bash $SCRIPTS_STORAGE/test.sh

eslint:
  stage: test
  script: bash $SCRIPTS_STORAGE/eslint.sh

# 编译 TS 文件
build:
  stage: build
  script: bash $SCRIPTS_STORAGE/build.sh

deploy_development:
  stage: deploy_development
  script: bash $SCRIPTS_STORAGE/deploy.sh 10.0.0.1
  only: dev     # 单独指定生效分支

deploy_production:
  stage: deploy_production
  script: bash $SCRIPTS_STORAGE/deploy.sh 10.0.0.2
  only: master  # 单独指定生效分支
```

我们将每一步 `CI/CD` 所需要执行的脚本都放到了 `runner` 那台服务器上，在配置文件中只是执行了那个脚本文件。  
这样当我们有什么策略上的调整，比如说 ESLint 规则的变更、部署方式之类的。  
这些都完全与项目之间进行解耦，后续的操作基本都不会让正在使用 CI/CD 的项目重新修改才能够支持（部分需要新增环境变量的导入之类的确实需要项目的支持）。  

### 接入钉钉通知

实际上，当 `CI/CD` 执行成功或者失败，我们可以在 `Pipeline` 页面中看到，也可以设置一些邮件通知，但这些都不是时效性很强的。  
鉴于我们目前在使用钉钉进行工作沟通，所以就研究了一波钉钉机器人。  
发现有支持 GitLab 机器人，不过功能并不适用，只能处理一些 issues 之类的， `CI/CD` 的一些通知是缺失的，所以只好自己基于钉钉的消息模版实现一下了。  

因为上边我们已经将各个步骤的操作封装了起来，所以这个修改对同事们是无感知的，我们只需要修改对应的脚本文件，添加钉钉的相关操作即可完成，封装了一个简单的函数：

```bash
function sendDingText() {
  local text="$1"

  curl -X POST "$DINGTALK_HOOKS_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "msgtype": "text",
    "text": {
        "content": "'"$text"'"
    }
  }'
}

# 具体发送时传入的参数
sendDingText "proj: $CI_PROJECT_NAME[$CI_JOB_NAME]\nenv: $CI_ENVIRONMENT_NAME\ndeploy success\n$CI_PIPELINE_URL\ncreated by: $GITLAB_USER_NAME\nmessage: $CI_COMMIT_MESSAGE"

# 某些 case 失败的情况下 是否需要更多的信息就看自己自定义咯
sendDingText "error: $CI_PROJECT_NAME[$CI_JOB_NAME]\nenv: $CI_ENVIRONMENT_NAME"
```

上述用到的环境变量，除了`DINGTALK_HOOKS_URL`是我们自定义的机器人通知地址以外，其他的变量都是有 `GitLab runenr`所提供的。  

*各种变量可以从这里找到：[predefined variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html)*  

### 回滚处理

聊完了正常的流程，那么也该提一下出问题时候的操作了。  
人非圣贤孰能无过，很有可能某次上线一些没有考虑到的地方就会导致服务出现异常，这时候首要任务就是让用户还可以照常访问，所以我们会选择回滚到上一个有效的版本去。  
在项目中的 `Pipeline` 页面 或者 `Enviroment` 页面（这个需要在配置文件中某些 `job` 中手动添加这个属性，一般会写在 `deploy` 的那一步去），可以在页面上选择想要回滚的节点，然后重新执行 `CI/CD` 任务，即可完成回滚。  

不过这在 `TypeScript` 项目中会有一些问题，因为我们回滚一般来讲是重新执行上一个版本 `CI/CD` 中的 `deploy` 任务，在 TS 项目中，我们在 `runner` 中缓存了 TS 转换 JS 之后的 `dist` 文件夹，并且部署的时候也是直接将该文件夹推送到服务器的（TS项目的源码就没有再往服务器上推过了）。  

而如果我们直接点击 `retry` 就会带来一个问题，因为我们的 `dist` 文件夹是缓存的，而 `deploy` 并不会管这种事儿，他只会把对应的要推送的文件发送到服务器上，并重启服务。  

而实际上 `dist` 还是最后一次（也就是出错的那次）编译出来的 JS 文件，所以解决这个问题有两种方法：

1. 在 `deploy` 之前执行一下 `build`
2. 在 `deploy` 的时候进行判断

第一个方案肯定是不可行的，因为严重依赖于操作上线的人是否知道有这个流程。  
所以我们主要是通过第二种方案来解决这个问题。  

我们需要让脚本在执行的时候知道，`dist` 文件夹里边的内容是不是自己想要的。  
所以就需要有一个 __标识__，而做这个标识最简单有效唾手可得的就是，`git commit id`。  
每一个 `commit` 都会有一个唯一的标识符号，而且我们的 `CI/CD` 执行也是依靠于新代码的提交（也就意味着一定有 `commit`）。  
所以我们在 `build` 环节将当前的`commit id`也缓存了下来：

```bash
git rev-parse --short HEAD > git_version
```

同时在 `deploy` 脚本中添加额外的判断逻辑：

```bash
currentVersion=`git rev-parse --short HEAD`
tagVersion=`touch git_version; cat git_version`

if [ "$currentVersion" = "$tagVersion" ]
then
    echo "git version match"
else
    echo "git version not match, rebuild dist"
    bash ~/runner-scripts/build.sh  # 额外的执行 build 脚本
fi
```

这样一来，就避免了回滚时还是部署了错误代码的风险。  

> 关于为什么不将 `build` 这一步操作与 `deploy` 合并的原因是这样的：  
> 因为我们会有很多台机器，同时 `job` 会写很多个，类似 `deploy_1`、`deploy_2`、`deploy_all`，如果我们将 `build` 的这一步放到 `deploy` 中  
> 那就意味着我们每次 `deploy`，即使是一次部署，但因为我们选择一台台机器单独操作，它也会重新生成多次，这也会带来额外的时间成本

### hot fix 的处理

在 `CI/CD` 运行了一段时间后，我们发现偶尔解决线上 `bug` 还是会比较慢，因为我们提交代码后要等待完整的 `CI/CD` 流程走完。  
所以在研究后我们决定，针对某些特定情况`hot fix`，我们需要跳过`ESLint`、单元测试这些流程，快速的修复代码并完成上线。  

`CI/CD` 提供了针对某些 `Tag` 可以进行不同的操作，不过我并不想这么搞了，原因有两点：
1. 这需要修改配置文件（所有项目）
2. 这需要开发人员熟悉对应的规则（打 `Tag`）

所以我们采用了另一种取巧的方式来实现，因为我们的分支都是只接收`Merge Request`那种方式上线的，所以他们的`commit title`实际上是固定的：`Merge branch 'XXX'`。  
同时 `CI/CD` 会有环境变量告诉我们当前执行 `CI/CD` 的 `commit message`。  
我们通过匹配这个字符串来检查是否符合某种规则来决定是否跳过这些`job`：

```bash
function checkHotFix() {
  local count=`echo $CI_COMMIT_TITLE | grep -E "^Merge branch '(hot)?fix/\w+" | wc -l`

  if [ $count -eq 0 ]
  then
    return 0
  else
    return 1
  fi
}

# 使用方法

checkHotFix

if [ $? -eq 0 ]
then
  echo "start eslint"
  npx eslint --ext .js,.ts .
else
  # 跳过该步骤
  echo "match hotfix, ignore eslint"
fi
```

这样能够保证如果我们的分支名为 `hotfix/XXX` 或者 `fix/XXX` 在进行代码合并时， `CI/CD` 会跳过多余的代码检查，直接进行部署上线。 _没有跳过安装依赖的那一步，因为 TS 编译还是需要这些工具的_  

## 小结

目前团队已经有超过一半的项目接入了 `CI/CD` 流程，为了方便同事接入（主要是编辑 `.gitlab-ci.yml` 文件），我们还提供了一个脚手架用于快速生成配置文件（包括自动建立机器之间的信任关系）。  

相较之前，部署的速度明显的有提升，并且不再对本地网络有各种依赖，只要是能够将代码 `push` 到远程仓库中，后续的事情就和自己没有什么关系了，并且可以方便的进行小流量上线（部署单台验证有效性）。  

以及在回滚方面则是更灵活了一些，可在多个版本之间快速切换，并且通过界面的方式，操作起来也更加直观。  

最终可以说，如果没有 `CI/CD`，实际上开发模式也是可以忍受的，不过当使用了 `CI/CD` 以后，再去使用之前的部署方式，则会明显的感觉到不舒适。（没有对比，就没有伤害😂）  

### 完整的流程描述

1. 安装依赖
2. 代码质量检查
   1. `ESLint` 检查
      1. 检查是否为 `hotfix` 分支，如果是则跳过本流程
   2. 单元测试
      1. 检查是否为 `hotfix` 分支，如果是则跳过本流程
3. 编译 TS 文件
4. 部署、上线
   1. 判断当前缓存 `dist` 目录是否为有效的文件夹，如果不是则重新执行第三步编译 TS 文件
   2. 上线完毕后发送钉钉通知

### 后续要做的

接入 `CI/CD` 只是第一步，将部署上线流程统一后，可以更方便的做一些其他的事情。  
比如说在程序上线后可以验证一下接口的有效性，如果发现有错误则自动回滚版本，重新部署。  
或者说接入 `docker`， 这些调整在一定程度上对项目维护者都是透明的。  

## 参考资料

- [GitLab CI/CD](https://docs.gitlab.com/ee/ci)
- [钉钉自定义机器人](https://open-doc.dingtalk.com/microapp/serverapi2/qf2nxq#-4)