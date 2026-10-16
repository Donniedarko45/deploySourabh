// Experiment 6: Snyk dependency scan for the CloudFire website.
// Needs the Snyk Security plugin, a Snyk installation named 'snyk@latest'
// and a "Snyk API token" credential with the ID 'snyk-api-token'.
// Setup: docs/experiments/experiment-6-snyk-jenkins.md

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    parameters {
        choice(name: 'SEVERITY', choices: ['high', 'critical', 'medium', 'low'],
               description: 'Lowest severity that counts as a finding')
        booleanParam(name: 'FAIL_ON_ISSUES', defaultValue: true,
                     description: 'Fail the build when Snyk reports a finding at or above SEVERITY')
        booleanParam(name: 'MONITOR', defaultValue: true,
                     description: 'Send a dependency snapshot to the Snyk dashboard (snyk monitor)')
    }

    stages {
        stage('Source') {
            steps {
                sh '''
                    git log -1 --format='Commit %h on %cd: %s' --date=iso
                    test -f package-lock.json
                    echo "Lockfile present: package-lock.json"
                '''
            }
        }

        stage('Snyk dependency scan') {
            steps {
                snykSecurity(
                    snykInstallation: 'snyk@latest',
                    snykTokenId: 'snyk-api-token',
                    targetFile: 'package.json',
                    projectName: 'deploySourabh',
                    severity: params.SEVERITY,
                    failOnIssues: params.FAIL_ON_ISSUES,
                    failOnError: true,
                    monitorProjectOnBuild: params.MONITOR
                )
            }
        }
    }

    post {
        success {
            echo "Snyk gate passed: no ${params.SEVERITY}+ findings blocked this build."
        }
        failure {
            echo 'Snyk gate failed. Open "Snyk Security Report" on this build for the findings and fixes.'
        }
    }
}
